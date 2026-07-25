import React from "react";
import "../../app/styles/terms-and-condition.css";
import StickNavbar from "./StickNavbar";


const sections = [
  {
    heading: "Collection of Information",
    content: (
      <>
        <p>
          You may visit and browse the Sites without providing personally
          identifiable information about yourself. However, this may limit your
          ability to receive certain features, products or services from us.
        </p>{" "}
        <h2>*Personal Information:</h2>
        <p>
          We collect personal information from you when you submit it to us,
          including by: (a) registering on the Site; (b) placing an order; (c)
          signing up for our newsletter; (d) contacting us; or (d) participating
          in a Site promotion or survey. This information may include, for
          example, your name, email address, mailing address, billing address,
          telephone number, date of birth, and credit or debit card information.
          We collect and store the information provided. We may also ask you to
          provide other information, such as demographic information, age or
          about your product preferences and interests.
        </p>{" "}
        <p>
          You may also be able to register and log in using your Facebook
          account. When you use a social media account to log into the Sites,
          you may also be able to use certain social features on the Sites. For
          Facebook log in, Facebook will ask your permission to share certain
          information from your Facebook account with the Site. This may include
          your first name, last name, gender, profile picture, list of friends,
          a link to your Facebook profile, interests and other data that is part
          of your or your friends’ Facebook profile(s). This information is
          collected by Facebook and is provided to us under the terms of
          Facebook’s privacy policy. You can control the information that we
          receive from Facebook using the privacy settings in your Facebook
          account.
        </p>{" "}
      </>
    ),
  },
  {
    heading: "Information We Collect Automatically",
    content: (
      <>
        <p>
          When you visit the Site, we may collect certain non-personal
          information from you, including your Internet Protocol (IP) address,
          browser type, operating system, the specific web pages visited during
          your connection, and the domain name from which you accessed the Site.
          In addition, we may collect information about your browsing behaviour,
          such as the date and time you visit the Site, the areas or pages of
          the Site that you visit, the amount of time you spend viewing the
          Site, the number of times you return to the Site and other clickstream
          data. We may also use non-personal information for statistical
          analysis, research, and other purposes.
        </p>
        <p>
          Like many Web sites, we use “Cookies,” which are data files placed on
          a Device when it is used to visit the Sites to facilitate site
          navigation, personalize your experience, and includes tailoring
          advertisements. Cookies may also be used to associate you with social
          networking sites like Facebook and Instagram and, if you so choose,
          enable interaction between your activities on the Sites and your
          activities on these social networking sites. We, may place cookies or
          similar files on your Device for security purposes, to facilitate site
          navigation and to personalize your experience while visiting our Sites
          (such as allowing us to select which ads or offers are most likely to
          appeal to you, based on your interests, preferences, location, or
          demographic information).
        </p>
        <p>
          If you would prefer not to accept cookies, you will be notified with a
          pop-up in the browser which lets you choose whether or not to accept
          it; or set your browser to automatically not accept any cookies.
          However, please be aware that some features and services on our Sites
          may not work properly because we may not be able to recognize and
          associate you with your account. In addition, the offers we provide
          when you visit us may not be as relevant to you or tailored to your
          interests. We may combine the non-personal information we collect
          through cookies with other information we have collected from you.
        </p>{" "}
      </>
    ),
  },
  {
    heading: "Use of Information",
    content: (
      <>
        <p>
          We may use the information we collect from and about you for any of
          the following purposes: (a) to fulfil your requests for products; (b)
          to respond to your inquiries; (c) to review Site usage and operations;
          (d) to address problems with the Site, our business or our services;
          (e) to protect the security or integrity of the Site and our business;
          (f) to monitor the Site for compliance with our Terms of Use and the
          law; and (g) to contact you with Site updates, newsletters and other
          informational and promotional materials from us and third party
          marketing offers from our trusted partners.
        </p>{" "}
        <p>
          If you do not wish to receive communications from us about special
          offers and promotions, you can opt-out of receiving these
          communications by following the instructions contained in the messages
          you receive. Even if you opt-out of receiving these messages, we
          reserve the right to send you certain communications relating to the
          services we provide, and we may send you service announcements and
          administrative messages. We do not offer you the opportunity to
          opt-out of receiving those communications.
        </p>{" "}
        <p>
          We may share non–Personal Information, such as aggregate user
          statistics, demographic information, and Usage Information with third
          parties, except as provided in this Privacy Policy and Cookie Notice,
          we will not provide any of your Personal Information to any third
          parties without your specific consent.
        </p>
        {/* <ul>
          <li>Provide, operate, and maintain our website.</li>
          <li>Improve, personalize, and expand our webste.</li>
          <li>Understand and analyze how you use our webste.</li>
          <li>Develop new products, services, features, and functionality.</li>
          <li>
            Communicate with you, either directly or through one of our
            partners, inclu9ding for customer service, to provide you with
            updates and other information relating to the webste, and for
            marketing and promotional purposes.
          </li>
          <li>Send you emails</li>
          <li>Find and prevent fraud</li>
        </ul> */}
      </>
    ),
  },
  {
    heading: "Disclosure of Information",
    content: (
      <>
        <p>
          We may disclose information collected from and about you with other
          entities [Company Legal Entity Name] as follows: (1) to perform a
          business, professional or technical support function for us; (2) to
          our marketing partners, advertisers or other third parties, who may
          contact you with their own offers; (3) as necessary if we believe that
          there has been a violation of the Site Terms of Use or of our rights
          or the rights of any third party; (4) to respond to legal process
          (such as a search warrant, subpoena or court order) and provide
          information to law enforcement agencies or in connection with an
          investigation on matters related to public safety, as required by law;
          and (5) in the event that our company or substantially all of its
          assets are acquired, your personal information may be one of the
          transferred assets. We may also disclose your personal information
          with your express consent. We may share aggregate, non-personally
          identifiable information about Site users with third parties.
        </p>{" "}
        <p>
          Please note that if you voluntarily submit any personal information
          for posting on the Site, such as a review or a blog post, the
          information becomes publicly available and can be collected and used
          by others, so you should use care before posting information about
          yourself online.
        </p>{" "}
      </>
    ),
  },
  {
    heading: "Access to Your Personal Information",
    content: (
      <>
        <p>
          You may access your personal information by signing into your account.
          From there, you can correct or modify your information.
        </p>
        <p>
          If you wish to modify, verify, correct, delete, or update any of your
          Personal Information collected through the Sites, you may edit your
          profile preferences or contact us at the above address or e–mail. In
          accordance with our regular record keeping, we may delete certain
          records that contain Personal Information you have submitted through
          the Sites. We are under no obligation to store such Personal
          Information indefinitely and disclaim any liability arising out of the
          destruction of such Personal Information. In addition, you should be
          aware that it is not always possible to completely remove or delete
          all of your information from our databases without some residual data
          because of backups and other reasons.
        </p>{" "}
        <p>
          We will retain your information (including geo–location data) while
          your account is active or as needed to provide you services. If you
          wish to cancel your account or request that we no longer use your
          information to provide you services please contact us. We will retain
          and use your information as necessary to comply with our legal
          obligations, resolve disputes, and enforce our agreements. We do not
          control certain privacy settings and preferences maintained by our
          social media partners like Facebook and Instagram. If you wish to make
          changes to those settings and preferences, you may do so by visiting
          the settings page of the appropriate social media site.
        </p>
      </>
    ),
  },
  {
    heading: "Security",
    content: (
      <p>
        We maintain appropriate measures designed to safeguard the information
        we collect in a secure manner. Even though we follow reasonable
        procedures to try to protect the information in our possession, no
        security system is perfect and we cannot guarantee, and you should not
        expect, that your information will be secure in all circumstances.
      </p>
    ),
  },
  {
    heading: "Interest Based Advertising",
    content: (
      <>
        <p>
          We use licenses and third-party advertising companies that use
          tracking technologies and analytics to serve advertisements across the
          Internet and evaluate and provide us with information about the use of
          the Sites and viewing of our content. We do not share Personal
          Information with these third parties, these companies may collect
          anonymous information about your visits to the Site and other websites
          and your interaction with our advertising and other communications.
          These advertising companies serve ads on our behalf and others on
          non-affiliated sites, and some of those ads may be personalized,
          meaning that they are intended to be relevant to you based on
          information collected about your visits to this site and elsewhere
          over time. We may use a variety of companies to serve advertisements.
        </p>
      </>
    ),
  },
  {
    heading: "CCPA Privacy Rights",
    content: (
      <>
        <p>
          Under the CCPA, among other rights, California consumers have the
          right to: Request that a business that collects a consumer’s personal
          data disclose the categories and specific pieces of personal data that
          a business has collected about consumers. Request that a business
          delete any personal data about the consumer that a business has
          collected. Request that a business that sells a consumer’s personal
          data, not sell the consumer’s personal data. If you make a request, we
          have one month to respond to you. If you would like to exercise any of
          these rights, please contact us.
        </p>
      </>
    ),
  },
  {
    heading: "GDPR Data Protection Rights",
    content: (
      <>
        <p>
          We would like to make sure you are fully aware of all of your data
          protection rights. Every user is entitled to the following:
        </p>
        <ul>
          <li>
            The right to access – You have the right to request copies of your
            personal data. We may charge you a small fee for this service.
          </li>{" "}
          <li>
            – The right to rectification – You have the right to request that we
            correct any information you believe is inaccurate. You also have the
            right to request that we complete the information you believe is
            incomplete.
          </li>{" "}
          <li>
            – The right to erasure – You have the right to request that we erase
            your personal data, under certain conditions.
          </li>{" "}
          <li>
            – The right to restrict processing – You have the right to request
            that we restrict the processing of your personal data, under certain
            conditions.
          </li>{" "}
          <li>
            – The right to object to processing – You have the right to object
            to our processing of your personal data, under certain conditions.
          </li>
          <li>
            – The right to data portability – You have the right to request that
            we transfer the data that we have collected to another organization,
            or directly to you, under certain conditions.
          </li>
          <p>
            If you make a request, we have one month to respond to you. If you
            would like to exercise any of these rights, please contact us.
          </p>
        </ul>
      </>
    ),
  },
  {
    heading: "Contact Us",
    content: (
      <>
        <p>
          If you have any questions or suggestions about our Privacy Policy,
          please contact us at{" "}
          <a href="mailto:support@zainabstore.com">support@zainabstore.com</a>.
        </p>
      </>
    ),
  },
];

const PrivacyPolicy = () => {
  return (
    <>
    <StickNavbar />
    <div className="pp-wrapper">
      <div className="pp-hero">
        <h1>Privacy Policy</h1>
        <p>
          Thank you for visiting www.zainabstore.com. Zainab Store
          (referred to herein as "Zainab Store", "we", "our" or "us")
          appreciates the importance of your trust. This Privacy Policy
          describes the types of personal and non-personal information we
          collect on the Site, how we use such information, and under what
          circumstances we may disclose it. By accessing the Site on any
          device, you agree to the terms of this Privacy Policy. If you do not
          agree, please do not use the site.
        </p>{" "}
        <p>
          Zainab Store operates the e-commerce website
          www.zainabstore.com and related domains, sites, services and
          tools ("Website"). The Website allows you to browse and order
          premium everyday and occasion wear ("Products"). Zainab Store may
          update, modify, or remove Website content at any time without prior
          notice and will use reasonable efforts to keep information current.
        </p>{" "}
        <p>
          We reserve the right to modify this Privacy Policy at any time. If we
          decide to change any clause in this Privacy Policy, we will post
          those changes on our Site. We therefore encourage you to periodically
          review our Privacy Policy to stay informed about how we are using the
          information we collect.
        </p>
      </div>

      <div className="pp-sections">
        {sections.map((section, index) => (
          <div key={index} className="pp-row">
            <div className="pp-left">
              <h2>{section.heading}</h2>
            </div>
            <div className="pp-right">{section.content}</div>
            <div className="pp-divider" />
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default PrivacyPolicy;
